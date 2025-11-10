import { useState } from 'react';
import Tabs from '@/components/switchTab/Tabs';
import PasswordLogin from './PasswordLogin';
import CodeLogin from './CodeLogin';
import Button from '@/components/UI/Button';

export default function LoginReturn() {
  const [activeTab, setActiveTab] = useState(0);

  const handleBack = () => setActiveTab(0);

  const MethodSelect = () => (
    <div className="space-y-4">
      <h2>How would you like to log in?</h2>
      <div className="space-y-3">
        <Button
          className="w-full justify-center"
          onClick={() => setActiveTab(1)}
        >
          Log in with password
        </Button>
        <Button
          variant="secondary"
          className="w-full justify-center"
          onClick={() => setActiveTab(2)}
        >
          Email me a code
        </Button>
      </div>
    </div>
  );

  const tabs = [
    <MethodSelect key="method" />,
    <PasswordLogin key="password" onBack={handleBack} />,
    <CodeLogin key="code" onBack={handleBack} />,
  ];

  return (
    <div className="w-full">
      <h2 className="mb-3">Welcome Back!</h2>

      <Tabs tabs={tabs} activeTab={activeTab} />
    </div>
  );
}
