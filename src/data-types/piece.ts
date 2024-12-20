import Coordinate from './coordinate';
import Orientation from './orientation';
import Player from './player';
import Rotation from './rotation';

interface Piece {
  id: string;
  owner: Player;
  baseShape: Coordinate[];
  orientation: Orientation;
}

export default Piece;

export function transformedShape(piece: Piece): Coordinate[] {
  let transformed = piece.baseShape;

  switch (piece.orientation.rotation) {
    case Rotation.None:
      break;

    case Rotation.Ninety:
      transformed = transformed.map(c => ({ x: c.y, y: -c.x }));
      break;

    case Rotation.OneEighty:
      transformed = transformed.map(c => ({ x: -c.x, y: -c.y }));
      break;

    case Rotation.TwoSeventy:
      transformed = transformed.map(c => ({ x: -c.y, y: c.x }));
      break;
  }

  if (piece.orientation.flipped) {
    transformed = transformed.map(c => ({ x: -c.x, y: c.y }));
  }

  return transformed;
}