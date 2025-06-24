import { useThemeStore, Theme } from '@/hooks/useTheme';

export default function ThemeSwitcher() {
  const { theme, setTheme } = useThemeStore();

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTheme(e.target.value as Theme);
  };

  return <select
    value={theme}
    onChange={handleThemeChange}
    className='bg-secondary text-on-secondary rounded-md py-1 px-2 focus:outline-none appearance-none'
  >
    <option value='system'>System</option>
    <option value='light'>Light</option>
    <option value='dark'>Dark</option>
  </select >;
};