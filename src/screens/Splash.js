import { View, StatusBar, Dimensions, Image, ActivityIndicator} from 'react-native'
import React, { useContext } from 'react'
import { Colors } from '../theme/color'
import style from '../theme/style'
import themeContext from '../theme/themeContext'


import { SafeAreaView } from 'react-native-safe-area-context';

const width = Dimensions.get('screen').width
const height = Dimensions.get('screen').height

export default function Splash() {
    const theme = useContext(themeContext);
  return (
    <SafeAreaView style={[style.area,{backgroundColor:theme.bg}]}>
    <StatusBar backgroundColor="transparent" translucent={true}/>
    <View style={{
        flex:2.5,alignItems:'center',justifyContent:'center'
    }}>
        <Image source={theme.logo} style={{resizeMode:'stretch',height:height/14,width:width/1.8}}/>
    </View>
    <View style={{
        flex:1,alignItems:'center',justifyContent:'center'
    }}>
        <ActivityIndicator size={40} color={Colors.primary}/>
    </View>
</SafeAreaView>
  )
}