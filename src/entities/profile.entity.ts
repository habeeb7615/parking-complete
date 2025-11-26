import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SubscriptionPlan } from './subscription-plan.entity';

@Entity('profiles')
export class Profile {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column()
  user_name: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  phone_number: string;

  @Column({ nullable: true, select: false })
  password: string;

  @Column()
  role: string;

  @Column({ nullable: true })
  status: string;

  @Column({ nullable: true })
  attendant_name: string;

  @Column({ nullable: true })
  contractor_name: string;

  @Column({ nullable: true })
  device_fingerprint: string;

  @Column({ nullable: true, default: true })
  is_first_login: boolean;

  @Column('varchar', { length: 36, nullable: true })
  subscription_plan_id: string;

  @Column({ type: 'timestamp', nullable: true })
  subscription_start_date: Date;

  @Column({ type: 'timestamp', nullable: true })
  subscription_end_date: Date;

  @Column({ nullable: true })
  subscription_status: string;

  @Column({ nullable: true })
  created_by: string;

  @Column({ nullable: true })
  updated_by: string;

  @Column({ nullable: true })
  deleted_by: string;

  @Column({ type: 'timestamp', nullable: true })
  deleted_on: Date;

  @Column({ default: false })
  is_deleted: boolean;

  @CreateDateColumn({ name: 'created_on' })
  created_on: Date;

  @UpdateDateColumn({ name: 'updated_on' })
  updated_on: Date;

  @ManyToOne(() => SubscriptionPlan, { nullable: true })
  @JoinColumn({ name: 'subscription_plan_id' })
  subscription_plans: SubscriptionPlan;
}

