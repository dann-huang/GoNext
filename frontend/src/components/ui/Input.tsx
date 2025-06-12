interface InputProp extends React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> {
  bg?: string;
  padding?: string;
  rounded?: string;
}

export default function Input(prop: InputProp) {
  const { bg = 'bg-background', rounded = 'rounded-md', padding = 'p-2', className = '', ...rest } = prop;
  return <input
    className={`p-2 border border-secondary text-text
      focus:outline-none focus:ring-2 focus:ring-primary
      ${bg} ${rounded} ${padding} ${className}`}
    {...rest}
  />
}