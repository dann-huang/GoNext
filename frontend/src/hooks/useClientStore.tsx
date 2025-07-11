import { create } from 'zustand';

interface InitState {
  particlesInit: boolean;
  setParticlesInit: (init: boolean) => void;
}

export default create<InitState>()((set) => ({
  particlesInit: false,
  setParticlesInit: (init: boolean) => set({ particlesInit: init }),
}));
