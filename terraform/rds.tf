resource "aws_db_instance" "db" {
  identifier              = "app-postgres-db"

  engine                  = "postgres"
  engine_version          = "15.4"

  instance_class          = "db.t3.micro"
  allocated_storage       = 20
  storage_type            = "gp2"

  db_name                 = "appdb"
  username                = var.db_username
  password                = var.db_password

  publicly_accessible     = false
  skip_final_snapshot     = true
  deletion_protection     = false

  backup_retention_period = 7
  apply_immediately       = true

  tags = {
    Name = "app-postgres-db"
  }
}
