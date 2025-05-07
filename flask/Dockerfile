# Usar uma imagem oficial do Python
FROM python:3.13.1

# Definir o diretório de trabalho
WORKDIR /app

# Copiar arquivos
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Expõe a porta que o Flask usará
EXPOSE 5000

# Comando para iniciar a aplicação
CMD ["python", "app.py"]