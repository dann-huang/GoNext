'use client';

import { useMemo } from 'react';
import Particles from '@tsparticles/react';
import {
  type ISourceOptions,
  MoveDirection,
  OutMode,
} from '@tsparticles/engine';
import useThemeColor from '@/hooks/useThemeColor';
import useClientStore from '@/hooks/useClientStore';

export default function ParticleBox() {
  const { particlesInit } = useClientStore();
  const { primary } = useThemeColor();

  const options: ISourceOptions = useMemo(
    () => ({
      fpsLimit: 60,
      interactivity: {
        events: {
          onHover: {
            enable: true,
            mode: 'repulse',
          },
        },
        modes: {
          repulse: {
            distance: 200,
            duration: 1,
          },
        },
      },
      particles: {
        color: {
          value: primary,
        },
        links: {
          color: primary,
          distance: 120,
          enable: true,
          opacity: 0.5,
          width: 1,
          triangles: {
            enable: true,
            opacity: 0.1,
            color: primary,
          },
        },
        move: {
          direction: MoveDirection.none,
          enable: true,
          outModes: {
            default: OutMode.out,
          },
          random: true,
          speed: 2,
          straight: false,
        },
        number: {
          density: {
            enable: true,
          },
          value: 80,
        },
        opacity: {
          value: 0.8,
          animation: {
            enable: true,
            speed: 0.5,
            minimumValue: 0.1,
            sync: false,
          },
        },
        shape: {
          type: 'circle',
        },
        size: {
          value: { min: 2, max: 6 },
          animation: {
            enable: true,
            speed: 2,
            minimumValue: 1,
            sync: false,
          },
        },
        wobble: {
          distance: 10,
          enable: true,
          speed: {
            min: -2,
            max: 2,
          },
        },
      },
      detectRetina: true,
    }),
    [primary]
  );

  if (!particlesInit) return null;

  return <Particles id="tsparticles" options={options} className='pointer-events-none'/>;
}
