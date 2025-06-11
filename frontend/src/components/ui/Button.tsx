interface ButtonProp extends React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> {
  color?: string;
  padding?: string;
  rounded?: string;
}

export default function Button(props: ButtonProp) {
  const { color = 'primary', rounded = 'rounded-md', padding = 'py-2 px-4',
    className, children, ...rest } = props;
  const bg = 'bg-' + color, text = 'text-on-' + color;

  return <button
    className={`font-semibold hover:bg-accent transform hover:scale-105
      active:scale-95 flex items-center justify-center text-center shadow-md
      transition-colors ${padding} ${bg} ${text} ${rounded} ${className}`}
    {...rest}
  >
    {children}
  </button>
}