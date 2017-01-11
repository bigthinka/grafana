#/bin/bash
# Because of GO build requirements must create a symlink to your git checked out code
# So first 
# mkdir /home/mark/git/grafana/src/github.com/grafana
# ln -s /home/mark/git/grafana /home/mark/git/grafana/src/github.com/grafana/grafana


export GOPATH="/home/mark/git/grafana"

cd $GOPATH/src/github.com/grafana/grafana
go run build.go setup
go run build.go build

