import * as Updates from 'expo-updates';

let Config = {
    // development, preview
    // apiUrl: "https://pinnacle-api.geddit-apps.com",
    apiUrl: "https://amazed-mink-trivially.ngrok-free.app",
    publicToken: "1856bc1b3dfb5fdc409f3e8802370dfc3a00f0beafd6b4cc2edb0e48577a5315",
    stripePublishableKey: "pk_test_51NkM9NCu0dFCVV90qK6HoJbBpvNwvQGN7I6GSsq2o79j0Uub95litmd51IL64YHZLSV4vRMonMgy5EKtBKjuAste00wFy58CoA",
    paymentGateway2C2P: {
        apiEnvironment: 'Sandbox',
    },
    // Fixed across all environments
    appVersion: '1',
    stripeMerchantName: "PINNACLE FAMILY CLINIC PTE. LTD.",
    appStoreLink: {
        appName: "PinnacleSG+",
        appStoreId: 6502684044,
        appStoreLocale: "sg",
        playStoreId: "sg.com.pinnaclefamilyclinic.pinnaclesgplus"
    },
};

if (Updates.channel === 'production') {
    Config.apiUrl = "https://pinnaclesg-api.pinnaclefamilyclinic.com.sg";
    Config.publicToken = "1856bc1b3dfb5fdc409f3e8802370dfc3a00f0beafd6b4cc2edb0e48577a5315";
    Config.stripePublishableKey = "pk_live_51IFCfTL01T6H1Q0Od74XljqP7IGdzqBQzHUU1r4hDWrA08tUBafFtPPedBDt0715xNCmOSGAZGK7Yn5Hh80YprfG00LbSRbppW";
    Config.paymentGateway2C2P.apiEnvironment = 'Production';
}

export const apiUrl = Config.apiUrl;
export const publicToken = Config.publicToken;
export const appVersion = Config.appVersion;
export const appStoreLink = Config.appStoreLink;
export const stripeMerchantName = Config.stripeMerchantName;
export const stripePublishableKey = Config.stripePublishableKey;
export const paymentGateway2C2P = Config.paymentGateway2C2P;
