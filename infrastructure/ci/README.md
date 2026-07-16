# CI/CD

La pipeline GitLab canonique se trouve à la racine : `.gitlab-ci.yml`.

Aucun second fichier de pipeline ne doit être créé sous `infrastructure/ci/`. Les jobs Web et mobile s’activent lorsque les squelettes et fichiers de verrouillage de la release R0 sont présents.
