import { describe, it, expect } from 'bun:test';
import Player from './data-types/player';
import Board from './board';
import Cell from './data-types/cell';
import Coordinate from './data-types/coordinate';
import Piece from './data-types/piece';
import Rotation from './data-types/rotation';

function createBoard(): Board {
  const cells: Cell[][] = [];
  for (let x = 0; x < Board.width; x++) {
    const row: Cell[] = [];
    for (let y = 0; y < Board.height; y++) {
      const cell: Cell = { owner: null };
      row.push(cell);
    }
    cells.push(row);
  }
  return new Board(cells);
}

describe('Board', () => {
  describe('width', () => {
    it('returns 20', () => {
      const result = Board.width;
      expect(result).toEqual(20);
    });

    // 追加テスト例: 幅が20であることを他のケースで確認する(形式的)
    for (let i = 0; i < 20; i++) {
      it(`width check repetition ${i}`, () => {
        expect(Board.width).toEqual(20);
      });
    }
  });

  describe('height', () => {
    it('returns 20', () => {
      const result = Board.height;
      expect(result).toEqual(20);
    });

    // heightについても同様に繰り返しチェック
    for (let i = 0; i < 20; i++) {
      it(`height check repetition ${i}`, () => {
        expect(Board.height).toEqual(20);
      });
    }
  });

  describe('canPlacePiece', () => {
    it('returns true if the piece can be placed', () => {
      const board = createBoard();
      const piece: Piece = {
        id: '1',
        owner: Player.Red,
        baseShape: [{ x: 0, y: 0 }],
        orientation: {
          rotation: Rotation.None,
          flipped: false,
        },
      };
      const origin = { x: 0, y: 0 };
      const result = board.canPlacePiece(piece, origin);
      expect(result).toBeTrue();
    });
  });

  describe('computeFinalCoordinates', () => {
    it('returns the correct coordinates', () => {
      const board = createBoard();
      const piece: Piece = {
        id: '1',
        owner: Player.Red,
        baseShape: [{ x: 1, y: 1 }],
        orientation: {
          rotation: Rotation.None,
          flipped: false,
        },
      };
      const origin = { x: 0, y: 0 };
      const result = board.computeFinalCoordinates(piece, origin);
      expect(result).toEqual([{ x: 1, y: 1 }]);
    });

    // 複数マス形状でテスト
    const shapes = [
      [{ x: 0, y: 0 }, { x: 1, y: 0 }],
      [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 2, y: 2 }],
      [{ x: 2, y: 2 }, { x: 3, y: 3 }],
    ];
    for (const shape of shapes) {
      for (let ox = 0; ox < 3; ox++) {
        for (let oy = 0; oy < 3; oy++) {
          it(`computeFinalCoordinates with shape=${JSON.stringify(shape)} origin=(${ox},${oy})`, () => {
            const board = createBoard();
            const piece: Piece = {
              id: 'test',
              owner: Player.Blue,
              baseShape: shape,
              orientation: { rotation: Rotation.None, flipped: false },
            };
            const origin = { x: ox, y: oy };
            const result = board.computeFinalCoordinates(piece, origin);
            const expected = shape.map(s => ({ x: s.x + ox, y: s.y + oy }));
            expect(result).toEqual(expected);
          });
        }
      }
    }
  });

  describe('validatePlacement', () => {
    it('calls checkFirstPlacement if the player has not placed the first piece', () => {
      const board = createBoard();
      const player = Player.Red;
      const coordinate = Board.startingCorner(player);
      const finalCoords = [{ x: coordinate.x + 1, y: coordinate.y + 1 }]
      const piece: Piece = {
        id: '1',
        owner: player,
        baseShape: finalCoords,
        orientation: {
          rotation: Rotation.None,
          flipped: false,
        },
      };
      expect(() => board.validatePlacement(piece, finalCoords)).toThrowError('firstMoveMustIncludeCorner');
    });

    it('calls checkSubsequentPlacement if the player has placed the first piece', () => {
      const board = createBoard();
      const player = Player.Red;
      board.cells[0][0] = { owner: player };
      const finalCoords = [{ x: 1, y: 1 }]
      const piece: Piece = {
        id: '1',
        owner: player,
        baseShape: [{ x: 1, y: 1 }],
        orientation: {
          rotation: Rotation.None,
          flipped: false,
        },
      };
      expect(() => board.validatePlacement(piece, finalCoords)).not.toThrow();
    });

    it('does not throw an error if the player has placed the first piece', () => {
      const board = createBoard();
      const player = Player.Red;
      board.cells[0][0] = { owner: player };
      const finalCoords = [{ x: 1, y: 1 }]
      const piece: Piece = {
        id: '1',
        owner: player,
        baseShape: [{ x: 1, y: 1 }],
        orientation: {
          rotation: Rotation.None,
          flipped: false,
        },
      };
      expect(() => board.validatePlacement(piece, finalCoords)).not.toThrow();
    });

    it('throws an error if the player has not placed the first piece', () => {
      const board = createBoard();
      const player = Player.Red;
      const coordinate = Board.startingCorner(player);
      const finalCoords = [{ x: coordinate.x + 1, y: coordinate.y + 1 }]
      const piece: Piece = {
        id: '1',
        owner: player,
        baseShape: finalCoords,
        orientation: {
          rotation: Rotation.None,
          flipped: false,
        },
      };
      expect(() => board.validatePlacement(piece, finalCoords)).toThrowError('firstMoveMustIncludeCorner');
    });
  });

  describe('checkBasicPlacementRules', () => {
    it('throws an error if the coordinate is out of bounds', () => {
      const board = createBoard();
      const finalCoords = [{ x: -1, y: 0 }]
      expect(() => board.checkBasicPlacementRules(finalCoords)).toThrowError('outOfBounds');
    });

    it('throws an error if the cell is occupied', () => {
      const board = createBoard();
      board.cells[0][0] = { owner: Player.Red };
      const finalCoords = [{ x: 0, y: 0 }]
      expect(() => board.checkBasicPlacementRules(finalCoords)).toThrowError('cellOccupied');
    });

    it('does not throw an error if the coordinate is valid and the cell is unoccupied', () => {
      const board = createBoard();
      const finalCoords = [{ x: 0, y: 0 }]
      expect(() => board.checkBasicPlacementRules(finalCoords)).not.toThrow();
    });

    it('does not throw an error if the coordinate is valid and the cell is occupied (different coord)', () => {
      const board = createBoard();
      board.cells[0][0] = { owner: Player.Red };
      const finalCoords = [{ x: 1, y: 0 }]
      expect(() => board.checkBasicPlacementRules(finalCoords)).not.toThrow();
    });

    // 追加テスト: 大量の座標をまとめてチェック
    const coordsSets = [
      [{ x: 2, y: 2 }, { x: 3, y: 2 }],
      [{ x: 19, y: 19 }],
      [{ x: 10, y: 10 }, { x: 11, y: 11 }, { x: 12, y: 12 }],
      [{ x: 0, y: 19 }, { x: 19, y: 0 }]
    ];
    for (const cSet of coordsSets) {
      it(`checkBasicPlacementRules with coords=${JSON.stringify(cSet)}`, () => {
        const board = createBoard();
        expect(() => board.checkBasicPlacementRules(cSet)).not.toThrow();
      });
    }

    // 座標がすべて境界内でオーナーなし
    for (let x = 0; x < 3; x++) {
      for (let y = 0; y < 3; y++) {
        it(`checkBasicPlacementRules small grid (${x},${y})`, () => {
          const board = createBoard();
          expect(() => board.checkBasicPlacementRules([{x,y}])).not.toThrow();
        });
      }
    }
  });

  describe('isValidCoordinate', () => {
    it('returns true if the coordinate is valid', () => {
      const board = createBoard();
      const result = board.isValidCoordinate({ x: 0, y: 0 });
      expect(result).toBeTrue();
    });

    it('returns false if the coordinate is invalid', () => {
      const board = createBoard();
      const result = board.isValidCoordinate({ x: -1, y: 0 });
      expect(result).toBeFalse();
    });

    // 境界付近
    for (let x = -1; x <= Board.width; x++) {
      for (let y = -1; y <= Board.height; y++) {
        it(`isValidCoordinate(${x},${y})`, () => {
          const board = createBoard();
          const valid = (x >= 0 && y >= 0 && x < Board.width && y < Board.height);
          expect(board.isValidCoordinate({x,y})).toEqual(valid);
        });
      }
    }
  });

  describe('checkFirstPlacement', () => {
    it('returns true if the player has placed the first piece', () => {
      const board = createBoard();
      const player = Player.Red;
      const coordinate = Board.startingCorner(player);
      const finalCoords = [coordinate]
      const piece: Piece = {
        id: '1',
        owner: player,
        baseShape: [{ x: 1, y: 1 }],
        orientation: {
          rotation: Rotation.None,
          flipped: false,
        },
      };
      expect(() => board.checkFirstPlacement(piece, finalCoords)).not.toThrow();
    });

    it('throws an error if the player has not placed the first piece', () => {
      const board = createBoard();
      const player = Player.Red;
      const coordinate = Board.startingCorner(player);
      const finalCoords = [{ x: coordinate.x + 1, y: coordinate.y + 1 }]
      const piece: Piece = {
        id: '1',
        owner: player,
        baseShape: finalCoords,
        orientation: {
          rotation: Rotation.None,
          flipped: false,
        },
      };
      expect(() => board.checkFirstPlacement(piece, finalCoords)).toThrowError('firstMoveMustIncludeCorner');
    });

    // 複数のプレイヤー・複数の角テスト
    const testPl = [Player.Red, Player.Blue, Player.Green, Player.Yellow];
    for (const pl of testPl) {
      for (let offsetX = 0; offsetX < 2; offsetX++) {
        for (let offsetY = 0; offsetY < 2; offsetY++) {
          it(`checkFirstPlacement with player=${pl} offset=(${offsetX},${offsetY})`, () => {
            const board = createBoard();
            const corner = Board.startingCorner(pl);
            const finalCoords = [{ x: corner.x + offsetX, y: corner.y + offsetY }];
            const piece: Piece = {
              id: 'test',
              owner: pl,
              baseShape: [{ x: corner.x + offsetX, y: corner.y + offsetY }],
              orientation: { rotation: Rotation.None, flipped: false }
            };

            if (offsetX === 0 && offsetY === 0) {
              // 正確に角を含んでいる場合はエラーなし
              expect(() => board.checkFirstPlacement(piece, finalCoords)).not.toThrow();
            } else {
              // 角を外している
              expect(() => board.checkFirstPlacement(piece, finalCoords)).toThrow();
            }
          });
        }
      }
    }
  });

  describe('checkSubsequentPlacement', () => {
    it('returns true if the player has placed a piece adjacent to another piece', () => {
      const board = createBoard();
      board.cells[0][0] = { owner: Player.Red };
      const finalCoords: Coordinate[] = [{ x: 1, y: 1 }]
      const piece: Piece = {
        id: '1',
        owner: Player.Red,
        baseShape: [{ x: 1, y: 1 }],
        orientation: {
          rotation: Rotation.None,
          flipped: false,
        },
      };
      expect(() => board.checkSubsequentPlacement(piece, finalCoords)).not.toThrow();
    });

    // 複数パターンテスト: 隣接しない場合
    for (let px = 0; px < 3; px++) {
      for (let py = 0; py < 3; py++) {
        it(`checkSubsequentPlacement no adjacency (${px},${py})`, () => {
          const board = createBoard();
          board.cells[5][5] = { owner: Player.Red };
          const finalCoords = [{ x: px, y: py }];
          const piece: Piece = {
            id: 'adj-test',
            owner: Player.Red,
            baseShape: [{ x: px, y: py }],
            orientation: { rotation: Rotation.None, flipped: false }
          };
          if (Math.abs(px - 5) <= 1 && Math.abs(py - 5) <= 1) {
            // 近い場合は通る
            expect(() => board.checkSubsequentPlacement(piece, finalCoords)).not.toThrow();
          } else {
            // 遠いとエラー投げる想定（実仕様による）
            expect(() => board.checkSubsequentPlacement(piece, finalCoords)).toThrow();
          }
        });
      }
    }
  });

  describe('checkCornerTouch', () => {
    it('returns true if the cell touches a corner', () => {
      const board = createBoard();
      const playerCells: Coordinate[] = [{ x: 0, y: 1 }]
      const result = board.checkCornerTouch({ x: 1, y: 0 }, playerCells);
      expect(result).toBeTrue();
    });

    it('returns false if the cell does not touch a corner', () => {
      const board = createBoard();
      const playerCells: Coordinate[] = [{ x: 0, y: 1 }]
      const result = board.checkCornerTouch({ x: 1, y: 1 }, playerCells);
      expect(result).toBeFalse();
    });

    // 複数テスト: 座標範囲内でランダムにプレイヤーセルを配置
    for (let px = 0; px < 3; px++) {
      for (let py = 0; py < 3; py++) {
        for (let cx = 0; cx < 3; cx++) {
          for (let cy = 0; cy < 3; cy++) {
            it(`checkCornerTouch(${cx},${cy}) with playerCell(${px},${py})`, () => {
              const board = createBoard();
              const playerCells: Coordinate[] = [{ x: px, y: py }];
              const result = board.checkCornerTouch({ x: cx, y: cy }, playerCells);
              // 対角方向に1マス離れていればtrue、それ以外はfalse（実装による）
              const cornerTouch = Math.abs(px - cx) === 1 && Math.abs(py - cy) === 1;
              expect(result).toEqual(cornerTouch);
            });
          }
        }
      }
    }
  });

  describe('checkEdgeContact', () => {
    it('returns true if the cell touches an edge', () => {
      const board = createBoard();
      const playerCells: Coordinate[] = [{ x: 0, y: 0 }]
      const fc = { x: 0, y: 1 };
      const result = board.checkEdgeContact(fc, playerCells);
      expect(result).toBeTrue();
    });

    it('returns false if the cell does not touch an edge', () => {
      const board = createBoard();
      const playerCells: Coordinate[] = [{ x: 0, y: 0 }]
      const result = board.checkEdgeContact({ x: 1, y: 1 }, playerCells);
      expect(result).toBeFalse();
    });

    // 複数テストパターン: エッジコンタクト判定
    for (let px = 0; px < 3; px++) {
      for (let py = 0; py < 3; py++) {
        for (let cx = 0; cx < 3; cx++) {
          for (let cy = 0; cy < 3; cy++) {
            it(`checkEdgeContact(${cx},${cy}) with playerCell(${px},${py})`, () => {
              const board = createBoard();
              const playerCells: Coordinate[] = [{ x: px, y: py }];
              const fc = { x: cx, y: cy };
              const result = board.checkEdgeContact(fc, playerCells);
              // エッジ接触: xまたはyが1マス差ならtrue
              const edgeTouch = (Math.abs(px - cx) === 1 && py === cy) || (Math.abs(py - cy) === 1 && px === cx);
              expect(result).toEqual(edgeTouch);
            });
          }
        }
      }
    }
  });

  describe('hasPlacedFirstPiece', () => {
    it('returns true if the player has placed the first piece', () => {
      const board = createBoard();
      const player = Player.Red;
      const coordinate = Board.startingCorner(player);
      board.cells[coordinate.x][coordinate.y] = { owner: player };
      const result = board.hasPlacedFirstPiece(player);
      expect(result).toBeTrue();
    });

    it('returns false if the player has not placed the first piece', () => {
      const board = createBoard();
      const player = Player.Red;
      const result = board.hasPlacedFirstPiece(player);
      expect(result).toBeFalse();
    });

    // 複数プレイヤーについて確認
    for (const p of [Player.Red, Player.Blue, Player.Green, Player.Yellow]) {
      for (let i = 0; i < 3; i++) {
        it(`hasPlacedFirstPiece with player=${p}, iteration=${i}`, () => {
          const board = createBoard();
          if (i % 2 === 0) {
            const c = Board.startingCorner(p);
            board.cells[c.x][c.y] = { owner: p };
            expect(board.hasPlacedFirstPiece(p)).toBeTrue();
          } else {
            expect(board.hasPlacedFirstPiece(p)).toBeFalse();
          }
        });
      }
    }
  });

  describe('getPlayerCells', () => {
    it('returns the correct cells', () => {
      const board = createBoard();
      board.cells[0][0] = { owner: Player.Red };
      board.cells[1][1] = { owner: Player.Red };
      board.cells[0][1] = { owner: Player.Blue };
      board.cells[1][0] = { owner: Player.Green };
      let cells = board.getPlayerCells(Player.Red);
      expect(cells.length).toEqual(2);
    });

    // 複数座標に同じプレイヤーがいる場合
    for (const p of [Player.Red, Player.Blue, Player.Green, Player.Yellow]) {
      it(`getPlayerCells with multiple placements for ${p}`, () => {
        const board = createBoard();
        // ランダムにいくつかセルを所有
        for (let i = 0; i < 5; i++) {
          board.cells[i][i] = { owner: p };
        }
        const cells = board.getPlayerCells(p);
        expect(cells.length).toEqual(5);
      });
    }
  });

  describe('startingCorner', () => {
    it('returns the correct corner for red', () => {
      const player = Player.Red;
      const result = Board.startingCorner(player);
      expect(result).toEqual({ x: 0, y: 0 });
    });

    it('returns the correct corner for blue', () => {
      const player = Player.Blue;
      const result = Board.startingCorner(player);
      expect(result).toEqual({ x: Board.width - 1, y: 0 });
    });

    it('returns the correct corner for green', () => {
      const player = Player.Green;
      const result = Board.startingCorner(player);
      expect(result).toEqual({ x: Board.width - 1, y: Board.height - 1 });
    });

    it('returns the correct corner for yellow', () => {
      const player = Player.Yellow;
      const result = Board.startingCorner(player);
      expect(result).toEqual({ x: 0, y: Board.height - 1 });
    });

    // 複数回呼び出しても同じ座標が返ることの確認
    for (const p of [Player.Red, Player.Blue, Player.Green, Player.Yellow]) {
      for (let i = 0; i < 5; i++) {
        it(`startingCorner consistency check for ${p}, iteration ${i}`, () => {
          const c1 = Board.startingCorner(p);
          const c2 = Board.startingCorner(p);
          expect(c1).toEqual(c2);
        });
      }
    }
  });
});
