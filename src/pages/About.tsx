import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';

const About: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>About</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">About</IonTitle>
          </IonToolbar>
        </IonHeader>
        <div className="ion-padding">
          <h2>Multi-Agent Grid World</h2>
          <p>A Progressive Web App for simulating multi-agent systems in a grid environment.</p>
          <p>Built with Ionic React and TypeScript.</p>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default About;