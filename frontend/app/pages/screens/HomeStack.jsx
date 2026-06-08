// app/navigation/HomeStack.jsx
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import NormalUserHome from "./NormalUserHome";
import PostDetails from "../../user/PostDetails";

const Stack = createNativeStackNavigator();

export default function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="NormalUserHome" 
        component={NormalUserHome} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="PostDetails" 
        component={PostDetails} 
        options={{ title: "Post Details" }} 
      />
    </Stack.Navigator>
  );
}
