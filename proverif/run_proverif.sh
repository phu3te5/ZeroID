#!/bin/bash

echo "=== Running ProVerif on zklogin_secure.pv ==="

# Vérifier que le fichier existe
if [ ! -f zklogin_secure.pv ]; then
  echo "Erreur : fichier zklogin_secure.pv introuvable."
  exit 1
fi

# Exécuter ProVerif et rediriger la sortie vers un fichier log
proverif zklogin_secure.pv > result.txt

# Afficher le résultat
echo "=== Résultat de ProVerif ==="
cat result.txt

# Fin
echo "=== Analyse terminée ==="
