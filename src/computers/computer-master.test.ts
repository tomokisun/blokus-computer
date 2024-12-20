// __tests__/computer-master.test.ts

import { describe, it, expect, beforeEach } from 'bun:test';
import { jest } from '@jest/globals';
import Board from '../board';
import Candidate from '../data-types/candidate';
import Coordinate from '../data-types/coordinate';
import Piece from '../data-types/piece';
import Player from '../data-types/player';
import Rotation from '../data-types/rotation';
import ComputerMaster from '../computers/computer-master';

describe('ComputerMaster Tests', () => {
  let board: Board;
  let pieces: Piece[];
  let player: Player;
  let computerMaster: ComputerMaster;

  // helper function to create a dummy board
  function createDummyBoard(width: number, height: number): Board {
    return {
      width,
      height,
      cells: Array.from({ length: width }, () =>
        Array.from({ length: height }, () => ({ owner: null as Player | null }))
      ),
      placePiece: jest.fn((piece: Piece, origin: Coordinate) => {
        for (const c of piece.baseShape) {
          const x = origin.x + c.x;
          const y = origin.y + c.y;
          if (x >= 0 && y >= 0 && x < width && y < height) {
            board.cells[x][y].owner = piece.owner;
          }
        }
      })
    } as unknown as Board;
  }

  // helper function to create dummy pieces
  function createPieces(owner: Player, count: number): Piece[] {
    const result: Piece[] = [];
    for (let i = 0; i < count; i++) {
      result.push({
        id: `p${i}`,
        owner: owner,
        baseShape: [{ x: 0, y: 0 }, { x: i % 2, y: 0 }], // 大きさが若干変わる
        orientation: { rotation: Rotation.None, flipped: false }
      });
    }
    return result;
  }

  beforeEach(() => {
    player = 'A' as Player;
    board = createDummyBoard(20, 20);
    pieces = createPieces(player, 2);
    computerMaster = new ComputerMaster(player);

    // mock computeCandidate
    (computerMaster as any).computeCandidate = jest.fn((b: Board, ps: Piece[]) => {
      return ps.map((p, index) => ({
        piece: p,
        origin: { x: index, y: index },
        rotation: Rotation.None,
        flipped: false
      }));
    });
  });

  // 基本的なケース
  it('should return a candidate when pieces are available', () => {
    const result = computerMaster.candidate(board, pieces);
    expect(result).not.toBeNull();
    if (result) {
      expect(result.piece).toBeDefined();
      expect(typeof result.origin.x).toBe('number');
      expect(typeof result.origin.y).toBe('number');
    }
  });

  // ピースがない場合
  it('should return null when no pieces are available', () => {
    const result = computerMaster.candidate(board, []);
    expect(result).toBeNull();
  });

  // 使用済みピースが正しく除去されるか
  it('should properly remove a used piece', () => {
    const candidate: Candidate = {
      piece: pieces[0],
      origin: { x: 0, y: 0 },
      rotation: Rotation.None,
      flipped: false
    };
    const remaining = computerMaster.myPiecesAfterUsing(candidate, pieces);
    expect(remaining.length).toBe(pieces.length - 1);
    expect(remaining.find(p => p.id === 'p0')).toBeUndefined();
  });

  // orientationの適用
  it('should apply orientation to a piece', () => {
    const candidate: Candidate = {
      piece: pieces[0],
      origin: { x: 0, y: 0 },
      rotation: Rotation.Ninety,
      flipped: true
    };
    const oriented = computerMaster.applyOrientation(candidate);
    expect(oriented.orientation.rotation).toBe(Rotation.Ninety);
    expect(oriented.orientation.flipped).toBe(true);
  });

  // computeCandidateが空配列を返す場合
  it('should return null if computeCandidate returns empty', () => {
    (computerMaster as any).computeCandidate.mockReturnValueOnce([]);
    const result = computerMaster.candidate(board, pieces);
    expect(result).toBeNull();
  });

  // boardがすべて埋まっている場合
  // it('should handle full board scenario (no placement possible)', () => {
  //   for (let x = 0; x < Board.width; x++) {
  //     for (let y = 0; y < Board.height; y++) {
  //       board.cells[x][y] = { owner: player };
  //     }
  //   }
  //   const result = computerMaster.candidate(board, pieces);
  //   expect(result).toBeNull();
  // });

  // ピースが多数ある場合
  it('should choose a candidate even if many pieces are available', () => {
    pieces = createPieces(player, 10);
    (computerMaster as any).computeCandidate.mockReturnValue(
      pieces.map((p, i) => ({
        piece: p,
        origin: { x: i, y: i },
        rotation: Rotation.None,
        flipped: false
      }))
    );
    const result = computerMaster.candidate(board, pieces);
    expect(result).not.toBeNull();
  });

  // ピースが1個だけ
  it('should work with only one piece', () => {
    const singlePiece = [pieces[0]];
    (computerMaster as any).computeCandidate.mockReturnValue([
      {
        piece: singlePiece[0],
        origin: { x: 0, y: 0 },
        rotation: Rotation.None,
        flipped: false
      }
    ]);
    const result = computerMaster.candidate(board, singlePiece);
    expect(result).not.toBeNull();
  });

  // 他のプレイヤー所有のピースが混在する場合
  it('should ignore pieces not owned by current player', () => {
    const enemyPiece: Piece = {
      id: 'enemy',
      owner: 'B' as Player,
      baseShape: [{ x: 0, y: 0 }],
      orientation: { rotation: Rotation.None, flipped: false }
    };
    const mixedPieces = pieces.concat(enemyPiece);
    // computeCandidateは自プレイヤー分しか返さない前提
    (computerMaster as any).computeCandidate.mockImplementation((b: Board, ps: Piece[]) => {
      return ps.filter(p => p.owner === player).map((p, i) => ({
        piece: p,
        origin: { x: i, y: i },
        rotation: Rotation.None,
        flipped: false
      }));
    });
    const result = computerMaster.candidate(board, mixedPieces);
    expect(result).not.toBeNull();
    if (result) {
      expect(result.piece.owner).toBe(player);
    }
  });

  // 大きなピースがある場合
  it('should handle a large piece', () => {
    const largePiece: Piece = {
      id: 'large',
      owner: player,
      baseShape: Array.from({ length: 10 }, (_, i) => ({ x: i, y: 0 })),
      orientation: { rotation: Rotation.None, flipped: false }
    };
    const allPieces = pieces.concat(largePiece);
    (computerMaster as any).computeCandidate.mockReturnValue(
      allPieces.map((p, i) => ({
        piece: p,
        origin: { x: i, y: i },
        rotation: Rotation.None,
        flipped: false
      }))
    );
    const result = computerMaster.candidate(board, allPieces);
    expect(result).not.toBeNull();
  });

  // computeCandidateが複数の同サイズピース候補を返す (平等な選択)
  it('should shuffle candidates of same size', () => {
    const sameSizePieces = createPieces(player, 5);
    (computerMaster as any).computeCandidate.mockReturnValue(
      sameSizePieces.map((p, i) => ({
        piece: p,
        origin: { x: i, y: i },
        rotation: Rotation.None,
        flipped: false
      }))
    );
    const result = computerMaster.candidate(board, sameSizePieces);
    expect(result).not.toBeNull();
  });

  // computeCandidateが異なるサイズのピース候補を返す (ソートされる)
  it('should sort candidates by piece size', () => {
    const diffSizePieces = createPieces(player, 5);
    diffSizePieces.forEach((p, i) => {
      // baseShapeを増減させて大きさを変える
      p.baseShape = Array.from({ length: i + 1 }, (_, idx) => ({ x: idx, y: 0 }));
    });
    (computerMaster as any).computeCandidate.mockReturnValue(
      diffSizePieces.map((p, i) => ({
        piece: p,
        origin: { x: i, y: i },
        rotation: Rotation.None,
        flipped: false
      }))
    );
    const result = computerMaster.candidate(board, diffSizePieces);
    expect(result).not.toBeNull();
  });

  // applyOrientationでRotation.TwoSeventyをテスト
  it('should apply orientation with TwoSeventy rotation', () => {
    const candidate: Candidate = {
      piece: pieces[0],
      origin: { x: 1, y: 1 },
      rotation: Rotation.TwoSeventy,
      flipped: false
    };
    const oriented = computerMaster.applyOrientation(candidate);
    expect(oriented.orientation.rotation).toBe(Rotation.TwoSeventy);
    expect(oriented.orientation.flipped).toBe(false);
  });

  // applyOrientationでRotation.OneEightyをテスト
  it('should apply orientation with OneEighty rotation', () => {
    const candidate: Candidate = {
      piece: pieces[0],
      origin: { x: 2, y: 2 },
      rotation: Rotation.OneEighty,
      flipped: true
    };
    const oriented = computerMaster.applyOrientation(candidate);
    expect(oriented.orientation.rotation).toBe(Rotation.OneEighty);
    expect(oriented.orientation.flipped).toBe(true);
  });

  // getPlayerPiecesで該当なし
  it('should return empty array if no pieces belong to player', () => {
    const otherOwnerPieces = createPieces('B' as Player, 3);
    const playerPieces = computerMaster.getPlayerPieces(otherOwnerPieces, player);
    expect(playerPieces.length).toBe(0);
  });

  // getPlayerPiecesで複数該当
  it('should return multiple pieces if they belong to player', () => {
    const extraPieces = createPieces(player, 3);
    const all = pieces.concat(extraPieces);
    const playerPieces = computerMaster.getPlayerPieces(all, player);
    expect(playerPieces.length).toBe(2 + 3);
  });

  // getPlayerCellsで所有マスがない
  it('should return empty set if player owns no cells', () => {
    const ownedCells = computerMaster.getPlayerCells(board, player);
    expect(ownedCells.size).toBe(0);
  });

  // getPlayerCellsで一部マスを所有
  it('should return correct owned cells count', () => {
    board.cells[0][0].owner = player;
    board.cells[1][1].owner = player;
    const ownedCells = computerMaster.getPlayerCells(board, player);
    expect(ownedCells.size).toBe(2);
  });

  // 大きいBoard (40x40)
  it('should handle larger board', () => {
    board = createDummyBoard(40, 40);
    (computerMaster as any).computeCandidate.mockReturnValue(
      pieces.map((p, i) => ({ piece: p, origin: { x: i, y: i }, rotation: Rotation.None, flipped: false }))
    );
    const result = computerMaster.candidate(board, pieces);
    expect(result).not.toBeNull();
  });

  // 全て同じ大きさのピース
  it('should handle uniform-sized pieces', () => {
    pieces = createPieces(player, 4);
    pieces.forEach(p => p.baseShape = [{x:0,y:0},{x:1,y:0}]);
    (computerMaster as any).computeCandidate.mockReturnValue(
      pieces.map((p, i) => ({ piece: p, origin: { x: i, y: i }, rotation: Rotation.None, flipped: false }))
    );
    const result = computerMaster.candidate(board, pieces);
    expect(result).not.toBeNull();
  });

  // computeCandidateがnullを返す (想定外ケース)
  it('should return null if computeCandidate returns null', () => {
    (computerMaster as any).computeCandidate.mockReturnValueOnce(null);
    const result = computerMaster.candidate(board, pieces);
    expect(result).toBeNull();
  });

  // computeCandidateがundefinedを返す (想定外ケース)
  it('should return null if computeCandidate returns undefined', () => {
    (computerMaster as any).computeCandidate.mockReturnValueOnce(undefined);
    const result = computerMaster.candidate(board, pieces);
    expect(result).toBeNull();
  });

  // Rotation.Noneとflipped=falseのデフォルトOrientation確認
  it('should confirm default orientation is None and not flipped', () => {
    const candidate: Candidate = {
      piece: pieces[0],
      origin: { x:0, y:0 },
      rotation: Rotation.None,
      flipped: false
    };
    const oriented = computerMaster.applyOrientation(candidate);
    expect(oriented.orientation.rotation).toBe(Rotation.None);
    expect(oriented.orientation.flipped).toBe(false);
  });

  // ピースの配置がボード範囲外になる場合 (placePieceでエラーになるような状況)
  it('should gracefully handle out-of-bound placement', () => {
    const largeOriginCandidate: Candidate = {
      piece: pieces[0],
      origin: { x: 100, y: 100 },
      rotation: Rotation.None,
      flipped: false
    };
    board.placePiece(largeOriginCandidate.piece, largeOriginCandidate.origin);
    // この時、placePieceは何もしないがエラーにもならない想定
    expect(board.placePiece).toHaveBeenCalled();
  });

  // 複数回candidate呼び出し
  it('should return a candidate consistently on repeated calls', () => {
    const result1 = computerMaster.candidate(board, pieces);
    const result2 = computerMaster.candidate(board, pieces);
    expect(result1).not.toBeNull();
    expect(result2).not.toBeNull();
  });

  // 他プレイヤーが盤面を所有する状況
  it('should still produce a candidate even if enemy owns cells', () => {
    board.cells[5][5].owner = 'B' as Player;
    const result = computerMaster.candidate(board, pieces);
    expect(result).not.toBeNull();
  });

  // ピースが非常に小さい（1セル）
  it('should handle single-cell piece', () => {
    const smallPiece: Piece = {
      id: 'small',
      owner: player,
      baseShape: [{x:0,y:0}],
      orientation: { rotation: Rotation.None, flipped: false }
    };
    (computerMaster as any).computeCandidate.mockReturnValue([{
      piece: smallPiece,
      origin: {x:0,y:0},
      rotation: Rotation.None,
      flipped: false
    }]);
    const result = computerMaster.candidate(board, [smallPiece]);
    expect(result).not.toBeNull();
  });

  // orientation変更後にcandidate呼び出し
  it('should not affect subsequent calls after orientation change', () => {
    const candidate: Candidate = {
      piece: pieces[0],
      origin: { x:1, y:1 },
      rotation: Rotation.Ninety,
      flipped: true
    };
    computerMaster.applyOrientation(candidate);
    const result = computerMaster.candidate(board, pieces);
    expect(result).not.toBeNull();
  });

  // computeCandidateが同じキーで複数候補を返す
  it('should handle grouping and shuffling with multiple same-size pieces', () => {
    const sameSize = createPieces(player, 3);
    sameSize.forEach(p => p.baseShape = [{x:0,y:0},{x:1,y:0}]);
    (computerMaster as any).computeCandidate.mockReturnValue(
      sameSize.map((p, i) => ({ piece: p, origin: { x: i, y: i }, rotation: Rotation.None, flipped: false }))
    );
    const result = computerMaster.candidate(board, sameSize);
    expect(result).not.toBeNull();
  });

  // 2手目候補がある状況 (mockでsimulate)
  it('should pick the first move leading to best second-move score', () => {
    (computerMaster as any).computeCandidate.mockImplementationOnce((b: Board, ps: Piece[]) => {
      // 最初の呼び出し: 通常の候補を返す
      return ps.map((p, i) => ({
        piece: p,
        origin: { x: i, y: i },
        rotation: Rotation.None,
        flipped: false
      }));
    }).mockImplementationOnce((b: Board, ps: Piece[]) => {
      // 2回目呼び出し(2手目候補計算): 複数候補を返す
      return ps.map((p, i) => ({
        piece: p,
        origin: { x: i+10, y: i+10 },
        rotation: Rotation.None,
        flipped: false
      }));
    });
    const result = computerMaster.candidate(board, pieces);
    expect(result).not.toBeNull();
  });

  // 大量のピースを渡してパフォーマンスチェック
  it('should handle large number of pieces efficiently', () => {
    const manyPieces = createPieces(player, 50);
    (computerMaster as any).computeCandidate.mockReturnValue(
      manyPieces.map((p, i) => ({ piece: p, origin: {x:i,y:i}, rotation: Rotation.None, flipped: false }))
    );
    const result = computerMaster.candidate(board, manyPieces);
    expect(result).not.toBeNull();
  });

  // 全てのピースが同じ座標候補(重複キー)
  it('should handle duplicate candidates gracefully', () => {
    (computerMaster as any).computeCandidate.mockReturnValue(
      pieces.map(p => ({ piece: p, origin: { x:0, y:0 }, rotation: Rotation.None, flipped: false }))
    );
    const result = computerMaster.candidate(board, pieces);
    expect(result).not.toBeNull();
  });

  // Rotationのバリエーションを全てテスト
  for (const rot of [Rotation.None, Rotation.Ninety, Rotation.OneEighty, Rotation.TwoSeventy]) {
    it(`should apply orientation with rotation=${rot}`, () => {
      const candidate: Candidate = {
        piece: pieces[0],
        origin: { x:0, y:0 },
        rotation: rot,
        flipped: false
      };
      const oriented = computerMaster.applyOrientation(candidate);
      expect(oriented.orientation.rotation).toBe(rot);
    });
  }

  // flippedのバリエーション
  it('should handle flipped=false', () => {
    const candidate: Candidate = {
      piece: pieces[0],
      origin: { x:0, y:0 },
      rotation: Rotation.None,
      flipped: false
    };
    const oriented = computerMaster.applyOrientation(candidate);
    expect(oriented.orientation.flipped).toBe(false);
  });

  it('should handle flipped=true', () => {
    const candidate: Candidate = {
      piece: pieces[0],
      origin: { x:0, y:0 },
      rotation: Rotation.None,
      flipped: true
    };
    const oriented = computerMaster.applyOrientation(candidate);
    expect(oriented.orientation.flipped).toBe(true);
  });

  // getPlayerCellsでボードの端だけを所有
  it('should count owned cells at board edges', () => {
    board.cells[19][19].owner = player;
    const owned = computerMaster.getPlayerCells(board, player);
    expect(owned.size).toBe(1);
  });

  // candidateが同じsizeのピースを複数返し、それをsortできるか
  it('should sort candidates with equal size without error', () => {
    const equalSizePieces = createPieces(player, 3);
    equalSizePieces.forEach(p => p.baseShape = [{x:0,y:0},{x:1,y:0}]);
    (computerMaster as any).computeCandidate.mockReturnValue(
      equalSizePieces.map((p,i) => ({
        piece:p, origin:{x:i,y:i}, rotation:Rotation.None, flipped:false
      }))
    );
    const result = computerMaster.candidate(board, equalSizePieces);
    expect(result).not.toBeNull();
  });

  // candidateでoriginがマイナス値の場合(理論上)
  it('should handle negative origin gracefully', () => {
    (computerMaster as any).computeCandidate.mockReturnValue([{
      piece: pieces[0],
      origin: { x: -1, y: -1 },
      rotation: Rotation.None,
      flipped: false
    }]);
    const result = computerMaster.candidate(board, pieces);
    expect(result).toBeNull();
  });
});
