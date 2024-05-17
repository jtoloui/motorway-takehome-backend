module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	setupFilesAfterEnv: ['./jest.setup.ts'],
	moduleFileExtensions: ['ts', 'js', 'json', 'node'],
};
