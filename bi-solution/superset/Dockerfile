FROM apache/superset:latest

USER root
COPY superset_config.py /app/pythonpath/superset_config.py
COPY init_superset.sh /docker-entrypoint-init.d/init_superset.sh
RUN chmod +x /docker-entrypoint-init.d/init_superset.sh

EXPOSE 8088