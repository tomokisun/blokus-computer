import Board from '../board';
import Candidate from '../data-types/candidate';
import Piece from '../data-types/piece';
import Computer from './computer';
import ComputerBase from './computer-base';

function shuffle<T>(arr: T[]): T[] {
  const newArr = arr.slice();
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

export default class ComputerMaster extends ComputerBase implements Computer {
  myPiecesAfterUsing(candidate: Candidate, from: Piece[]): Piece[] {
    return from.filter(piece => piece.id !== candidate.piece.id);
  }

  applyOrientation(candidate: Candidate): Piece {
    const piece = candidate.piece;
    piece.orientation = {
      rotation: candidate.rotation,
      flipped: candidate.flipped,
    }
    return piece;
  }

  candidate(board: Board, pieces: Piece[]): Candidate | null {
    const myPieces = this.getPlayerPieces(pieces, this.owner);
    if (myPieces.length === 0) {
      console.log(`(${this.owner}) has no pieces left and passes.`);
      return null;
    }

    var firstMoves = this.computeCandidate(board, myPieces);
    if (!firstMoves) {
      console.log(`(${this.owner}) cannot place any piece and passes.`);
      return null;
    }
    if (firstMoves.length === 0) {
      console.log(`(${this.owner}) cannot place any piece and passes.`);
      return null;
    }
    const grouped = firstMoves.reduce((acc: Record<number, Candidate[]>, candidate) => {
      const key = candidate.piece.baseShape.length;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(candidate);
      return acc;
    }, {});

    for (const key in grouped) {
      grouped[key] = shuffle(grouped[key]);
    }

    const sortedKeys = Object.keys(grouped)
      .map(k => parseInt(k, 10))
      .sort((a, b) => b - a);

    firstMoves = sortedKeys.flatMap(key => grouped[key]);

    var bestScore = 0
    var bestMove: Candidate | null = null;

    // firstMoveLoop: for firstMove in firstMoves {
    for (const firstMove of firstMoves) {
      const boardAfterFirst = board;
      boardAfterFirst.placePiece(this.applyOrientation(firstMove), firstMove.origin);

      // 相手はパス: boardAfterFirstそのまま

      // 2手目候補を計算
      const usedPieces = this.myPiecesAfterUsing(firstMove, myPieces);
      const secondMoves = this.computeCandidate(boardAfterFirst, usedPieces);

      if (secondMoves.length === 0) {
        // 2手目なし: この時点での占有数
        const myCells = this.getPlayerCells(boardAfterFirst, this.owner);
        const score = myCells.size;

        if (score > bestScore) {
          bestScore = score;
          bestMove = firstMove;
        }
      } else {
        var bestSecondScore = 0;
        for (const secondMove of secondMoves) {
          const boardAfterSecond = boardAfterFirst;
          boardAfterSecond.placePiece(this.applyOrientation(secondMove), secondMove.origin);

          const myCells = this.getPlayerCells(boardAfterSecond, this.owner);
          const score = myCells.size;
          if (score > bestSecondScore) {
            bestSecondScore = score;
          }
        }
        if (bestSecondScore > bestScore) {
          bestScore = bestSecondScore
          bestMove = firstMove;
        }
      }
    }

    if (bestMove) {
      return this.makeCandidate(bestMove);
    }
    console.log(`(${this.owner}) cannot find beneficial move and passes.`);
    return null;
  }
}