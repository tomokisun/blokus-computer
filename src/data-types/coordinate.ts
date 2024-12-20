interface Coordinate {
  x: number;
  y: number;
}

export default Coordinate;

export function toKey(coord: Coordinate): string {
  return `${coord.x},${coord.y}`;
}

export function diagonalNeighbors(coord: Coordinate): Coordinate[] {
  return [
    { x: coord.x - 1, y: coord.y - 1 },
    { x: coord.x + 1, y: coord.y - 1 },
    { x: coord.x - 1, y: coord.y + 1 },
    { x: coord.x + 1, y: coord.y + 1 }
  ];
}

export function edgeNeighbors(coord: Coordinate): Coordinate[] {
  return [
    { x: coord.x, y: coord.y - 1 },
    { x: coord.x, y: coord.y + 1 },
    { x: coord.x - 1, y: coord.y },
    { x: coord.x + 1, y: coord.y }
  ]
}