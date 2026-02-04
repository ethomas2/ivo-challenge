find challenges -name 'answer.txt' -delete
find challenges -name 'code' -print -exec rm -r {} +
find challenges -name 'logs' -exec rm -rf {} +
