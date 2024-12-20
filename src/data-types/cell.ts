import Player from './player';

interface Cell {
  owner: Player | null;
}

export default Cell;