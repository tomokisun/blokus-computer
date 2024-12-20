import Board from '../board';
import Candidate from '../data-types/candidate';
import Coordinate from '../data-types/coordinate';
import Piece, { transformedShape } from '../data-types/piece';
import Player from '../data-types/player';
import Rotation from '../data-types/rotation';

export default class ComputerBase {
  constructor(public owner: Player) {}

  /**
   * 与えられたCandidateから、ピースの姿勢(回転・反転)を反映したCandidateを返します。
   * 
   * Candidate内のpiece.orientationを、candidateのrotationおよびflippedで更新したうえで、
   * 新たなCandidateインスタンスを返す。
   * 
   * @param candidate 元となるCandidate
   * @returns orientationが反映された新たなCandidate
   */
  makeCandidate(candidate: Candidate): Candidate {
    let bestPiece = candidate.piece;
    bestPiece.orientation = {
      rotation: candidate.rotation,
      flipped: candidate.flipped
    };
    return {
      piece: bestPiece,
      origin: candidate.origin,
      rotation: candidate.rotation,
      flipped: candidate.flipped
    }
  }

  /**
   * 指定されたピースに対し、全ての回転（Rotation）および反転有無（flipped）の組み合わせで形状を変換し、
   * ユニークな形状のパターンを生成・収集します。
   * 
   * 返り値はタプルの配列で、各要素は `[回転, 反転フラグ, 正規化済み座標集合]` となります。
   * 重複形状は排除され、同一形状を生む重複した回転・反転パターンは追加されません。
   * 
   * @param piece 対象とするピース
   * @returns `(Rotation, boolean, Set<Coordinate>)`のタプル配列
   */
  generateUniqueOrientations(piece: Piece): Array<[Rotation, boolean, Set<Coordinate>]> {
    const rotations: Rotation[] = [Rotation.None, Rotation.Ninety, Rotation.OneEighty, Rotation.TwoSeventy];
    const flips: boolean[] = [false, true];
  
    const seenShapes = new Set<string>();
    const results: Array<[Rotation, boolean, Set<Coordinate>]> = [];
  
    /**
     * 座標集合をソートして文字列化することで、同一形状か判別可能なキーを生成します。
     * @param coordsSet 正規化済み座標Set
     * @returns 座標配列を`;`区切りで結合したユニークキー
     */
    function shapeKey(coordsSet: Set<Coordinate>): string {
      const arr = Array.from(coordsSet);
      arr.sort((a, b) => (a.x - b.x) || (a.y - b.y));
      return arr.map(c => `${c.x},${c.y}`).join(';');
    }
  
    for (const r of rotations) {
      for (const f of flips) {
        const testPiece: Piece = {
          ...piece,
          orientation: { rotation: r, flipped: f },
        };
  
        const transformed = transformedShape(testPiece);
        const normalized = this.normalizeShapeCoordinates(transformed);
        const key = shapeKey(normalized);
  
        // 同一形状を一度以上出力しない
        if (!seenShapes.has(key)) {
          seenShapes.add(key);
          results.push([r, f, normalized]);
        }
      }
    }
  
    return results;
  }

  /**
   * 与えられた座標配列を正規化（形状の左上が(0,0)にくるようにシフト）し、
   * 重複のない座標集合（Set）として返します。
   * 
   * 正規化の手順:
   * 1. x座標とy座標の最小値`minX`, `minY`を求める
   * 2. 全座標を`(x - minX, y - minY)`に変換し、形状を(0,0)起点へ正規化
   * 3. 重複排除のため、文字列化してユニークなキー集合を作り、Set<Coordinate>として再構築
   * 
   * @param coords 正規化対象の座標配列
   * @returns 正規化済みの一意な座標集合
   */
  normalizeShapeCoordinates(coords: Coordinate[]): Set<Coordinate> {
    const minX = Math.min(...coords.map(c => c.x));
    const minY = Math.min(...coords.map(c => c.y));
    const shifted = coords.map(c => ({ x: c.x - minX, y: c.y - minY }));
    
    // 重複排除
    const uniqueKeys = new Set(shifted.map(c => `${c.x},${c.y}`));

    const result = new Set<Coordinate>();
    for (const key of uniqueKeys) {
      const [xStr, yStr] = key.split(',');
      const x = parseInt(xStr, 10);
      const y = parseInt(yStr, 10);
      result.add({ x, y });
    }

    return result;
  }

  /**
   * 特定プレイヤーが所有するピース一覧を返します。
   * 
   * @param pieces 全てのピース
   * @param player 対象とするプレイヤー
   * @returns 指定されたプレイヤーが所有するピース配列
   */
  getPlayerPieces(pieces: Piece[], player: Player): Piece[] {
    return pieces.filter(piece => piece.owner === player);
  }

  /**
   * 与えられたプレイヤーがボード上で占めているセル座標の集合を返します。
   * Boardはセル単位でownerが割り当てられており、該当プレイヤーが所有するセルの座標を集めてSetで返します。
   * 
   * @param board ゲームボード
   * @param player 対象プレイヤー
   * @returns 該当プレイヤーが占有するセルの座標集合
   */
  getPlayerCells(board: Board, player: Player): Set<Coordinate> {
    const result = new Set<Coordinate>();
    for (let x = 0; x < Board.width; x++) {
      for (let y = 0; y < Board.height; y++) {
        if (board.cells[x][y].owner === player) {
          const coordinate: Coordinate = {
            x: x,
            y: y
          }
          result.add(coordinate);
        }
      }
    }
    return result;
  }
}
