import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import MapScreen from "./app/screens/MapScreen";
import ClinicNavigatorScreen from "./app/screens/ClinicNavigatorScreen";
import ClinicEvaluationScreen from "./app/screens/ClinicEvaluationScreen";
import CommunityExperienceScreen from "./app/screens/CommunityExperienceScreen";
import MedicalInfoScreen from "./app/screens/MedicalInfoScreen";
import AlternativesScreen from "./app/screens/AlternativesScreen";

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: true,
        }}
      >
        <Tab.Screen name="Map" component={MapScreen} />
        <Tab.Screen name="Clinics" component={ClinicNavigatorScreen} />
        <Tab.Screen name="AI Eval" component={ClinicEvaluationScreen} />
        <Tab.Screen name="Community" component={CommunityExperienceScreen} />
        <Tab.Screen name="Info" component={MedicalInfoScreen} />
        <Tab.Screen name="Alternatives" component={AlternativesScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}