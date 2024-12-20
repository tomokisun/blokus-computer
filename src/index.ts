import { Hono } from 'hono'
import Cell from './data-types/cell';
import Piece from './data-types/piece';
import Player from './data-types/player';
import ComputerMaster from './computers/computer-master';
import Board from './board';

const app = new Hono<{ Bindings: CloudflareBindings }>()

app.get('/', (c) => {
  return c.text('Hello Hono!');
});

app.post('/api/computer/master', async (c) => {
  const { cells, pieces, owner }: { cells: Cell[][]; pieces: Piece[], owner: Player } = await c.req.json()

  const computer = new ComputerMaster(owner);
  const board = new Board(cells)
  const candidate = computer.candidate(board, pieces);

  return c.json(candidate)
});

export default app
