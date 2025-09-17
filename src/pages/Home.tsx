import React from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { GridWorldDemo } from '../components/GridWorld/GridWorldDemo';

const Home: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Multi-Agent Grid World</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Multi-Agent Grid World</IonTitle>
          </IonToolbar>
        </IonHeader>
        <GridWorldDemo />
      </IonContent>
    </IonPage>
  );
};

export default Home;