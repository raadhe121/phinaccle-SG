import React, { useEffect } from 'react';
import { useAppDispatch } from '../store/store';
import { supabase } from '../lib/supabase';
import { View } from 'react-native';
import { setSession } from '../store/authSlice';

const AuthHandler = () => {
    const dispatch = useAppDispatch()

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            dispatch(setSession(session))
        })

        supabase.auth.onAuthStateChange((event, session) => {
            dispatch(setSession(session))
            // if (event == "INITIAL_SESSION") {

            // } else if (event == "SIGNED_IN") {

            // } else if (event == "SIGNED_OUT") {
            //   console.log("Signed out")
            // } else if (event == "PASSWORD_RECOVERY") {

            // } else if (event == "TOKEN_REFRESHED") {
            //   console.log("TOKEN REFRESHED")

            // } else if (event == "USER_UPDATED") {

            // }

        })
    }, [])


    return (
        <View>
        </View>

    );
};

export default AuthHandler;
