import { Exclude } from 'class-transformer';
import { Domain } from 'src/domains/entities/domain.entity';
import { Notification } from 'src/notifications/entities/notification.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 150, unique: true })
  email: string;

  @Exclude()
  @Column({ type: 'varchar', length: 255 })
  password: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'jsonb', nullable: true, default: () => "'[]'" })
  images?: { url: string; public_id: string }[];

  @Column({ type: 'jsonb', nullable: true, default: () => "'[]'" })
  videos?: { url: string; public_id: string }[];

  @Column({ type: 'timestamptz', nullable: true, name: 'last_seen' })
  lastSeen: Date | null;

  @OneToMany(() => Domain, (domain) => domain.user)
  domains: Domain[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];
}
