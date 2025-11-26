import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('subscription_plans')
export class SubscriptionPlan {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column()
  name: string;

  @Column('decimal')
  price: number;

  @Column('int')
  max_locations: number;

  @Column('int')
  max_attendants: number;

  @Column('json', { nullable: true })
  features: any;

  @Column({ default: false })
  is_deleted: boolean;

  @CreateDateColumn({ name: 'created_on' })
  created_on: Date;

  @UpdateDateColumn({ name: 'updated_on' })
  updated_on: Date;
}

