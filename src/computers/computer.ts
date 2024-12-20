import Board from '../board';
import Candidate from '../data-types/candidate';
import Piece from '../data-types/piece';

export default interface Computer {
  /**
   * 与えられたBoardと所有可能な複数のPieceに基づいて、ベストな候補配置（Candidate）を返すメソッド。
   * @param board 現在のゲームボード
   * @param pieces 利用可能なピースのリスト
   * @returns 最適なCandidate、あるいは見つからない場合はnull
   */
  candidate(board: Board, pieces: Piece[]): Candidate | null;
}
