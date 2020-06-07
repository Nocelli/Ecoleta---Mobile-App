import React, { useEffect, useState } from 'react'
import Constants from 'expo-constants'
import { Feather as Icon } from '@expo/vector-icons'
import { View, StyleSheet, TouchableOpacity, Text, ScrollView, Image, Alert } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import MapView, { Marker } from 'react-native-maps'
import { SvgUri } from 'react-native-svg'
import * as Location from 'expo-location'
import { AppLoading } from 'expo'
import api from '../../services/api'

interface Item {
    id: number
    title: string
    image_url: string
}
interface Point {
    id: number
    name: string
    image: string
    lat: number
    lon: number
}

interface Params {
    uf: string
    city: string
}

const Points = () => {

    const navigation = useNavigation()
    const route = useRoute()

    const [items, setItems] = useState<Item[]>([])
    const [selectedItems, setSelectedItems] = useState<number[]>([])
    const [points, setPoints] = useState<Point[]>([])
    const [initialPosition, setInitialPosition] = useState<[number, number]>([0, 0])

    const routeParams = route.params as Params

    useEffect(() => {
        api.get('items').then(response => {
            setItems(response.data)
        })
    }, [])

    useEffect(() => {
        (async function loadPosition() {
            const { status } = await Location.requestPermissionsAsync()

            if (status !== 'granted') {
                Alert.alert('Ooops...', 'Precisamos de sua permissão para obter a localização')
                return
            }

            const location = await Location.getCurrentPositionAsync()
            const { latitude, longitude } = location.coords

            setInitialPosition([
                latitude,
                longitude
            ])
        })()
    }, [])

    useEffect(() => {
        api.get('points', {
            params: {
                city: routeParams.city,
                uf: routeParams.uf,
                items: selectedItems
            }
        })
            .then(response => {
                setPoints(response.data)
            })
    }, [selectedItems])
    function handleNavigateBack() {
        navigation.goBack()
    }

    function handleNavigationToDetail(id: number) {
        navigation.navigate('Detail', { point_id: id })
    }

    function handleSelectItem(id: number) {
        const alreadySelected = selectedItems.findIndex(item => item === id)

        if (alreadySelected < 0) {
            setSelectedItems([...selectedItems, id])
            return
        }

        setSelectedItems(selectedItems.filter(item => item !== id))
    }

    if (!items.length) {
        return <AppLoading />
    }

    return (
        <>
            <View style={styles.container}>
                <TouchableOpacity onPress={handleNavigateBack}>
                    <Icon name='arrow-left' color={"#34cb79"} size={20} />
                </TouchableOpacity>

                <Text style={styles.title}>
                    Bem Vindo.
            </Text>
                <Text style={styles.description}>
                    Encontre no mapa um ponto de coleta.
            </Text>

                <View style={styles.mapContainer}>
                    {initialPosition[0] !== 0 && (
                        <MapView
                            style={styles.map}
                            loadingEnabled={initialPosition[0] === 0}
                            initialRegion={{
                                latitude: initialPosition[0],
                                longitude: initialPosition[1],
                                latitudeDelta: 0.014,
                                longitudeDelta: 0.014
                            }} >
                            {points.map(point => (
                                <Marker
                                    key={String(point.id)}
                                    style={styles.mapMarker}
                                    onPress={() => handleNavigationToDetail(point.id)}
                                    coordinate={{
                                        latitude: point.lat,
                                        longitude: point.lon,
                                    }}>
                                    <View style={styles.mapMarkerContainer} >
                                        <Image style={styles.mapMarkerImage} source={{ uri: point.image }} />
                                        <Text style={styles.mapMarkerTitle} >{`${point.name.slice(0,9).trimRight()}...`}</Text>
                                    </View>
                                </Marker>
                            ))}
                        </MapView>
                    )}
                </View>
            </View>
            <View style={styles.itemsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 28 }}>
                    {items.map(item => (
                        <TouchableOpacity
                            key={String(item.id)}
                            style={[
                                styles.item,
                                selectedItems.includes(item.id) ? styles.selectedItem : {}
                            ]}
                            activeOpacity={0.6}
                            onPress={() => { handleSelectItem(item.id) }}>
                            <SvgUri width={42} height={42} uri={item.image_url} />
                            <Text style={styles.itemTitle}>{item.title}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        </>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 32,
        paddingTop: 20 + Constants.statusBarHeight,
    },

    title: {
        fontSize: 20,
        fontFamily: 'Ubuntu_700Bold',
        marginTop: 24,
    },

    description: {
        color: '#6C6C80',
        fontSize: 16,
        marginTop: 4,
        fontFamily: 'Roboto_400Regular',
    },

    mapContainer: {
        flex: 1,
        width: '100%',
        borderRadius: 10,
        overflow: 'hidden',
        marginTop: 16,
    },

    map: {
        width: '100%',
        height: '100%',
    },

    mapMarker: {
        width: 90,
        height: 80,
    },

    mapMarkerContainer: {
        width: 90,
        height: 70,
        backgroundColor: '#34CB79',
        flexDirection: 'column',
        borderRadius: 8,
        overflow: 'hidden',
        alignItems: 'center'
    },

    mapMarkerImage: {
        width: 90,
        height: 45,
        resizeMode: 'cover',
    },

    mapMarkerTitle: {
        flex: 1,
        fontFamily: 'Roboto_400Regular',
        color: '#FFF',
        fontSize: 13,
        lineHeight: 23,
    },

    itemsContainer: {
        flexDirection: 'row',
        marginTop: 16,
        marginBottom: 32,
    },

    item: {
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#eee',
        height: 120,
        width: 120,
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 16,
        marginRight: 8,
        alignItems: 'center',
        justifyContent: 'space-between',

        textAlign: 'center',
    },

    selectedItem: {
        borderColor: '#34CB79',
        borderWidth: 2,
    },

    itemTitle: {
        fontFamily: 'Roboto_400Regular',
        textAlign: 'center',
        fontSize: 13,
    },
});

export default Points