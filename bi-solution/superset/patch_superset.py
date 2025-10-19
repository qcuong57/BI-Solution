# patch_superset.py
import sys
from datetime import datetime
from dateutil import parser

# Monkey patch để fix scheduled_dttm
original_create_log = None

def patched_create_log(self):
    """Patch create_log để convert scheduled_dttm từ string sang datetime"""
    from superset.models.reports import ReportExecutionLog
    from superset.reports.models import ReportSchedule
    
    # Lấy scheduled_dttm
    scheduled_dttm = self._scheduled_dttm
    
    # Nếu là string, convert sang datetime
    if isinstance(scheduled_dttm, str):
        scheduled_dttm = parser.parse(scheduled_dttm)
    
    # Tạo log với datetime đã được fix
    execution_log = ReportExecutionLog(
        scheduled_dttm=scheduled_dttm,
        report_schedule=self._report_schedule,
        state=self._execution_state,
    )
    return execution_log

# Apply patch
try:
    from superset.commands.report.execute import BaseReportState
    if hasattr(BaseReportState, '_create_log'):
        original_create_log = BaseReportState._create_log
        BaseReportState._create_log = patched_create_log
        print("✅ Superset datetime patch applied successfully!")
except Exception as e:
    print(f"❌ Failed to apply patch: {e}")