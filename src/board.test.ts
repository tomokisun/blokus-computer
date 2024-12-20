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
  });

  describe('height', () => {
    it('returns 20', () => {
      const result = Board.height;
      expect(result).toEqual(20);
    });
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
  })

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
      const coordinate = Board.startingCorner(player);
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
      const coordinate = Board.startingCorner(player);
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

    it('does not throw an error if the coordinate is valid and the cell is occupied', () => {
      const board = createBoard();
      board.cells[0][0] = { owner: Player.Red };
      const finalCoords = [{ x: 1, y: 0 }]
      expect(() => board.checkBasicPlacementRules(finalCoords)).not.toThrow
    });
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
  });

  describe('checkCornerTouch', () => {
    it('returns true if the cell touches a corner', () => {
      const board = createBoard();
      const playerCells: Coordinate[] = [{ x: 0, y: 1 }]
      const result = board.checkCornerTouch({ x: 1, y: 0 }, playerCells);
      expect(result).toBeTrue();
    })

    it('returns false if the cell does not touch a corner', () => {
      const board = createBoard();
      const playerCells: Coordinate[] = [{ x: 0, y: 1 }]
      const result = board.checkCornerTouch({ x: 1, y: 1 }, playerCells);
      expect(result).toBeFalse();
    });
  });

  describe('checkEdgeContact', () => {
    it('returns true if the cell touches an edge', () => {
      const board = createBoard();
      const playerCells: Coordinate[] = [{ x: 0, y: 0 }]
      const fc = { x: 0, y: 1 };
      const result = board.checkEdgeContact(fc, playerCells);
      expect(result).toBeTrue();
    })

    it('returns false if the cell does not touch an edge', () => {
      const board = createBoard();
      const playerCells: Coordinate[] = [{ x: 0, y: 0 }]
      const result = board.checkEdgeContact({ x: 1, y: 1 }, playerCells);
      expect(result).toBeFalse();
    });
  });

  describe('hasPlacedFirstPiece', () => {
    it('returns true if the player has placed the first piece', () => {
      const board = createBoard();
      const player = Player.Red;
      const coordinate = Board.startingCorner(player);
      board.cells[0][0] = { owner: player };
      const result = board.hasPlacedFirstPiece(player);
      expect(result).toBeTrue();
    });

    it('returns false if the player has not placed the first piece', () => {
      const board = createBoard();
      const player = Player.Red;
      const result = board.hasPlacedFirstPiece(player);
      expect(result).toBeFalse();
    });
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
  })
});
