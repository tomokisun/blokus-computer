import Cell from './data-types/cell';
import Coordinate, { diagonalNeighbors, edgeNeighbors, toKey } from './data-types/coordinate';
import Piece, { transformedShape } from './data-types/piece';
import Player from './data-types/player';

export default class Board {
  static width = 20;
  static height = 20;

  constructor(public cells: Cell[][]) {}

  /**
   * 指定のピースを特定の座標に置けるかどうか判定します（実際には置かない）。
   * @param piece 配置可否を判定するピース
   * @param origin 起点座標
   * @returns 配置可能なら `true`、不可能なら `false`
   */
  canPlacePiece(piece: Piece, origin: Coordinate): boolean {
    const finalCoords = this.computeFinalCoordinates(piece, origin);
    try {
      this.validatePlacement(piece, finalCoords); 
      return true;
    } catch {
      return false;
    }
  }

  // MARK: - Private methods

  /**
   * ピースを指定座標に配置した場合のセル座標の一覧を取得します。
   * @param piece 配置対象のピース
   * @param origin 起点座標
   * @returns ピースが占有する全セルの座標リスト
   */
  computeFinalCoordinates(piece: Piece, origin: Coordinate): Coordinate[] {
    const shape = transformedShape(piece);
    return shape.map(c => ({ x: origin.x + c.x, y: origin.y + c.y }));
  }

  /**
   * ピース配置時のバリデーションを行います。
   * @param piece 配置するピース
   * @param finalCoords ピースが占有するセル座標
   */
  validatePlacement(piece: Piece, finalCoords: Coordinate[]) {
    this.checkBasicPlacementRules(finalCoords);
    const isFirstMove = !this.hasPlacedFirstPiece(piece.owner);
    if (isFirstMove) {
      this.checkFirstPlacement(piece, finalCoords);
    } else {
      this.checkSubsequentPlacement(piece, finalCoords);
    }
  }

  /**
   * 基本的な配置チェック：ボード外・セル占有の有無を確認します。
   * @param finalCoords ピースが占有するセル座標
   */
  checkBasicPlacementRules(finalCoords: Coordinate[]) {
    for (const bc of finalCoords) {
      if (!this.isValidCoordinate(bc)) {
        throw new Error('outOfBounds');
      }
      const cell = this.cells[bc.x][bc.y];
      if (cell.owner) {
        throw new Error('cellOccupied');
      }
    }
  }

  /**
   * 指定した座標がボード上有効範囲内かを判定します。
   * @param c 座標
   * @returns 有効範囲内なら `true`、範囲外なら `false`
   */
  isValidCoordinate(c: Coordinate): boolean {
    return c.x >= 0 && c.x < Board.width && c.y >= 0 && c.y < Board.height
  }

  /**
   * 初回配置におけるチェック：プレイヤーの開始コーナーを含んでいるか確認します。
   * @param piece 配置するピース
   * @param finalCoords 占有するセル座標
   */
  checkFirstPlacement(piece: Piece, finalCoords: Coordinate[]) {
    const corner = Board.startingCorner(piece.owner);
    const finalCoordsSet = new Set(finalCoords.map(toKey));
    const result = finalCoordsSet.has(toKey(corner));
    if (!result) {
      throw new Error('firstMoveMustIncludeCorner');
    }
  }

  /**
   * 2回目以降の配置チェック：角接触必須、辺接触禁止のルールを検証します。
   * @param piece 配置対象のピース
   * @param finalCoords 占有セル座標
   */
  checkSubsequentPlacement(piece: Piece, finalCoords: Coordinate[]) {
    const playerCells = this.getPlayerCells(piece.owner);
    var cornerTouch = false;
    var edgeContactWithSelf = false;

    for (const fc of finalCoords) {
      if (this.checkCornerTouch(fc, playerCells)) {
        cornerTouch = true;
      }
      if (this.checkEdgeContact(fc, playerCells)) {
        edgeContactWithSelf = true;
      }
    }
    if (!cornerTouch) {
      throw new Error('mustTouchOwnPieceByCorner');
    }
    if (edgeContactWithSelf) {
      throw new Error('cannotShareEdgeWithOwnPiece');
    }
  }

  /**
   * 指定セルが斜め方向でプレイヤーのコマと接しているか確認します。
   * @param fc チェックするセル座標
   * @param playerCells プレイヤーが占有するセルの集合
   * @returns 斜め（角）接触がある場合は `true`
   */
  checkCornerTouch(fc: Coordinate, playerCells: Coordinate[]): boolean {
    const neighborsDiagonal = diagonalNeighbors(fc);
    const playerCellsSet = new Set(playerCells.map(toKey));
    return neighborsDiagonal.some(c => playerCellsSet.has(toKey(c)));
  }

  /**
   * 指定セルが上下左右方向でプレイヤーのコマと接していないか確認します。
   * @param fc チェックするセル座標
   * @param playerCells プレイヤーが占有するセルの集合
   * @returns 辺で接触がある場合は `true`
   */
  checkEdgeContact(fc: Coordinate, playerCells: Coordinate[]): boolean {
    const neighborsEdge = edgeNeighbors(fc);
    const playerCellsSet = new Set(playerCells.map(toKey));
    return neighborsEdge.some(c => playerCellsSet.has(toKey(c)));
  }

  /**
   * 指定したプレイヤーがすでに最初のピースを置いているかどうかを返します。
   * @param player チェックするプレイヤー
   * @returns 最初のピースが配置済みなら `true`、未配置なら `false`
   */
  hasPlacedFirstPiece(player: Player): boolean {
    const coordinate = Board.startingCorner(player);
    const cell = this.cells[coordinate.x][coordinate.y];
    return cell.owner === player;
  }

  /**
   * 指定プレイヤーが占有するセルすべてを取得します。
   * @param player プレイヤー
   * @returns 占有セル座標のセット
   */
  getPlayerCells(player: Player): Coordinate[] {
    const result: Coordinate[] = [];
    for (let x = 0; x < Board.width; x++) {
      for (let y = 0; y < Board.height; y++) {
        if (this.cells[x][y].owner === player) {
          const coordinate: Coordinate = { x, y };
          result.push(coordinate);
        }
      }
    }
    return result;
  }

  /**
   * 各プレイヤーの開始コーナー座標を返します。
   * @param player コーナーを取得したいプレイヤー
   * @returns プレイヤー開始地点の座標
   */
  static startingCorner(player: Player): Coordinate {
    switch (player) {
      case Player.Red:
        return { x: 0, y: 0 };
      case Player.Blue:
        return { x: Board.width - 1, y: 0 };
      case Player.Green:
        return { x: Board.width - 1, y: Board.height - 1 };
      case Player.Yellow:
        return { x: 0, y: Board.height - 1 };
    }
  }
}
