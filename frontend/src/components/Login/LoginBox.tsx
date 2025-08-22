import { useState } from 'react';
import { Selector } from '../switchTab/Selector';
import { Tabs } from '../switchTab/Tabs';
import LoginGuest from './LoginGuest';
import LoginReturn from './LoginReturn';

export default function LoginBox() {
  const [activeTab, setActiveTab] = useState(0);

  const tabLabels = ['New here?', 'Returning?'];
  const tabComponents = [<LoginGuest key="guest" />, <LoginReturn key="returning" />];

  return (
    <div className="w-full h-full p-10 flex flex-col items-center">
      <h2 className="text-2xl font-bold text-primary">Welcome</h2>
      <p className="text-sm mt-2">
        Some live features like chat requires an account.
      </p>
      
      <div className="w-full mt-5">
        <Selector
          tabs={tabLabels}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          className="justify-center"
        />
      </div>

      <div className="w-full mt-4">
        <Tabs
          tabs={tabComponents}
          activeTab={activeTab}
        />
      </div>
    </div>
  );
}
