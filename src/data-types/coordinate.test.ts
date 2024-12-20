import { expect, describe, it } from "bun:test";
import Coordinate, { diagonalNeighbors, edgeNeighbors } from './coordinate';

describe("Coordinate", () => {
  describe("diagonalNeighbors", () => {
    it("returns the diagonal neighbors of a coordinate", () => {
      const coord: Coordinate = { x: 0, y: 0 };
      const neighbors = diagonalNeighbors(coord);
      expect(neighbors).toEqual([
        { x: -1, y: -1 },
        { x: 1, y: -1 },
        { x: -1, y: 1 },
        { x: 1, y: 1 }
      ]);
    })
  });

  describe("edgeNeighbors", () => {
    it("returns the edge neighbors of a coordinate", () => {
      const coord: Coordinate = { x: 0, y: 0 };
      const neighbors = edgeNeighbors(coord);
      expect(neighbors).toEqual([
        { x: 0, y: -1 },
        { x: 0, y: 1 },
        { x: -1, y: 0 },
        { x: 1, y: 0 }
      ]);
    })
  });
});
