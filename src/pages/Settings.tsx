import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';

const Settings: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Settings</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Settings</IonTitle>
          </IonToolbar>
        </IonHeader>
        <div className="ion-padding">
          <p>Settings page - Coming soon!</p>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Settings;