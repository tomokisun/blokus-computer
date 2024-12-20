import Coordinate from './coordinate';
import Orientation from './orientation';
import Player from './player';

interface Piece {
  id: string;
  owner: Player;
  baseShape: Coordinate[];
  orientation: Orientation;
}

export default Piece;
