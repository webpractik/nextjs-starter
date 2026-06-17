import { beforeEach } from 'vitest'

import { frontendAllureLayers, setFrontendAllureLabels } from './allure-labels'

beforeEach(async ({ task }) => {
    await setFrontendAllureLabels(task.file.filepath, frontendAllureLayers.unit)
})
