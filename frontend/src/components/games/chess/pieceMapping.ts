import Bb from '@/assets/chess/bb.svg';
import Bk from '@/assets/chess/bk.svg';
import Bn from '@/assets/chess/bn.svg';
import Bp from '@/assets/chess/bp.svg';
import Bq from '@/assets/chess/bq.svg';
import Br from '@/assets/chess/br.svg';
import Wb from '@/assets/chess/wb.svg';
import Wk from '@/assets/chess/wk.svg';
import Wn from '@/assets/chess/wn.svg';
import Wp from '@/assets/chess/wp.svg';
import Wq from '@/assets/chess/wq.svg';
import Wr from '@/assets/chess/wr.svg';

interface PieceComponentProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

const numToPiece: Record<number, React.FC<PieceComponentProps>> = {
  1: Bk,
  2: Bq,
  3: Br,
  4: Bb,
  5: Bn,
  6: Bp,

  11: Wk,
  12: Wq,
  13: Wr,
  14: Wb,
  15: Wn,
  16: Wp,
} as const;

const numToString: Record<number, string> = {
  1: 'k',
  2: 'q',
  3: 'r',
  4: 'b',
  5: 'n',
  6: 'p',

  11: 'K',
  12: 'Q',
  13: 'R',
  14: 'B',
  15: 'N',
  16: 'P',
} as const;

export { numToPiece, numToString };
