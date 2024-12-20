import Coordinate from './coordinate';
import Piece from './piece';
import Rotation from './rotation';

interface Candidate {
  piece: Piece;
  origin: Coordinate;
  rotation: Rotation;
  flipped: boolean;
}

export default Candidate;
