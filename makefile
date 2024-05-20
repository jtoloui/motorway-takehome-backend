dockerComposeUp:
	cd ./docker && docker-compose up -d --force-recreate

dockerComposeDown:
	cd ./docker && docker-compose down --remove-orphans	--volumes


pruneAllVolumnes:
	docker volume prune -f

removeServiceDataStoreImage:
	docker image rm motorway-test-backend

.PHONY: dockerComposeUp dockerComposeDown pruneAllVolumnes removeServiceDataStoreImage