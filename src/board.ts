import Cell from './data-types/cell';
import Coordinate, { diagonalNeighbors, edgeNeighbors, toKey } from './data-types/coordinate';
import Player from './data-types/player';

export default class Board {
  static width = 20;
  static height = 20;

  constructor(public cells: Cell[][]) {}

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
