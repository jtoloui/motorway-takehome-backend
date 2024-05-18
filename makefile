dockerComposeUp:
	cd ./docker && docker-compose up -d

dockerComposeDown:
	cd ./docker && docker-compose down

.PHONY: dockerComposeUp dockerComposeDown