import Bb from '../svg/chess/bb.svg';
import Bk from '../svg/chess/bk.svg';
import Bn from '../svg/chess/bn.svg';
import Bp from '../svg/chess/bp.svg';
import Bq from '../svg/chess/bq.svg';
import Br from '../svg/chess/br.svg';
import Wb from '../svg/chess/wb.svg';
import Wk from '../svg/chess/wk.svg';
import Wn from '../svg/chess/wn.svg';
import Wp from '../svg/chess/wp.svg';
import Wq from '../svg/chess/wq.svg';
import Wr from '../svg/chess/wr.svg';

interface PieceComponentProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

const pieceMapping: Record<number, React.FC<PieceComponentProps>> = {
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

export default pieceMapping;
