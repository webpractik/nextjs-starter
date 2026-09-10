import adze, { setup } from 'adze'

const appName = process.env.APP_NAME

const store = setup({
    activeLevel: 'info',
    format: 'pretty',
})

store.addListener('alert', (log: adze) => {
    console.warn(log)
})

const logger = adze.withEmoji.timestamp.ns(...(appName === undefined ? [] : [appName])).seal()

export default logger
