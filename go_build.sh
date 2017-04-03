#/bin/bash
# Because of GO build requirements must create a symlink to your git checked out code
# So first 

export GOPATH="/home/${USER}/grafana420"

mkdir -p $GOPATH/src/github.com/grafana
ln -s $GOPATH $GOPATH/src/github.com/grafana/grafana

cd $GOPATH/src/github.com/grafana/grafana
go run build.go setup
go run build.go build

