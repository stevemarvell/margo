import React from 'react';
import { IonToast } from '@ionic/react';
import { refresh, checkmark } from 'ionicons/icons';
import './PWAUpdatePrompt.css';

const PWAUpdatePrompt: React.FC = () => {
  // For testing environment, use simple state
  if (import.meta.env.MODE === 'test') {
    return null;
  }

  // Dynamic import for PWA register to avoid issues in test environment
  const [pwaState, setPwaState] = React.useState({
    offlineReady: false,
    needRefresh: false,
    updateServiceWorker: () => window.location.reload()
  });

  React.useEffect(() => {
    const loadPWA = async () => {
      try {
        const { useRegisterSW } = await import('virtual:pwa-register/react');
        const {
          offlineReady: [offlineReady, setOfflineReady],
          needRefresh: [needRefresh, setNeedRefresh],
          updateServiceWorker,
        } = useRegisterSW({
          onRegisteredSW(swUrl, r) {
            console.log('SW Registered: ' + swUrl);
          },
          onRegisterError(error) {
            console.log('SW registration error', error);
          },
        });

        setPwaState({
          offlineReady,
          needRefresh,
          updateServiceWorker
        });
      } catch (error) {
        console.log('PWA not available:', error);
      }
    };

    loadPWA();
  }, []);

  const { offlineReady, needRefresh, updateServiceWorker } = pwaState;

  const close = () => {
    setPwaState(prev => ({
      ...prev,
      offlineReady: false,
      needRefresh: false
    }));
  };

  return (
    <>
      <IonToast
        isOpen={offlineReady}
        onDidDismiss={close}
        message="App ready to work offline"
        duration={4000}
        icon={checkmark}
        color="success"
        position="top"
      />

      <IonToast
        isOpen={needRefresh}
        onDidDismiss={close}
        message="New content available, click on reload button to update."
        position="top"
        buttons={[
          {
            side: 'start',
            icon: refresh,
            handler: () => updateServiceWorker(true)
          },
          {
            text: 'Later',
            role: 'cancel',
            handler: close
          }
        ]}
      />
    </>
  );
};

export default PWAUpdatePrompt;