package alerting

import (
	m "github.com/grafana/grafana/pkg/models"
	. "github.com/smartystreets/goconvey/convey"
	"testing"
)

func TestAlertingScheduler(t *testing.T) {
	Convey("Testing alert job selection", t, func() {
		mockFn := func() []m.AlertRule {
			return []m.AlertRule{
				{Id: 1, Title: "test 1"},
				{Id: 2, Title: "test 2"},
				{Id: 3, Title: "test 3"},
				{Id: 4, Title: "test 4"},
				{Id: 5, Title: "test 5"},
				{Id: 6, Title: "test 6"},
			}
		}

		Convey("single server", func() {
			scheduler := &Scheduler{
				jobs:           make([]*AlertJob, 0),
				runQueue:       make(chan *AlertJob, 1000),
				serverId:       "",
				serverPosition: 1,
				clusterSize:    1,
			}

			scheduler.updateJobs(mockFn)
			So(len(scheduler.jobs), ShouldEqual, 6)
		})

		Convey("two servers", func() {
			scheduler := &Scheduler{
				jobs:           make([]*AlertJob, 0),
				runQueue:       make(chan *AlertJob, 1000),
				serverId:       "",
				serverPosition: 1,
				clusterSize:    2,
			}

			scheduler.updateJobs(mockFn)
			So(len(scheduler.jobs), ShouldEqual, 3)
			So(scheduler.jobs[0].id, ShouldEqual, 1)
		})

		Convey("six servers", func() {
			scheduler := &Scheduler{
				jobs:           make([]*AlertJob, 0),
				runQueue:       make(chan *AlertJob, 1000),
				serverId:       "",
				serverPosition: 6,
				clusterSize:    6,
			}

			scheduler.updateJobs(mockFn)
			So(len(scheduler.jobs), ShouldEqual, 1)
			So(scheduler.jobs[0].id, ShouldEqual, 6)
		})
	})
}