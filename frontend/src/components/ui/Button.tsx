interface ButtonProp extends React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> {
  bg?: string;
  text?: string;
  padding?: string;
  rounded?: string;
}

export default function Button(props: ButtonProp) {
  const { bg = 'bg-primary', text = 'text-on-primary', rounded = 'rounded-md', padding = 'py-2 px-4',
    className, children, ...rest } = props;
  return <button
    className={`font-semibold hover:bg-accent transform hover:scale-105
      active:scale-95 flex items-center justify-center text-center shadow-md
      transition-colors ${padding} ${bg} ${text} ${rounded} ${className}`}
    {...rest}
  >
    {children}
  </button>
}