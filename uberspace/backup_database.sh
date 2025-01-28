set -e

timestamp="$(date '+%Y-%m-%d-%H-%M-%S')"
file="/home/${USER}/$timestamp.sql"

mysqldump ${USER} > $file

s3cmd put $file s3://serlo-test-database-backup

rm $file

echo 'Successfully backed up database on IONOS'
